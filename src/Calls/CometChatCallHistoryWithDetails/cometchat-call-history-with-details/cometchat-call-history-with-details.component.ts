import { Component, OnInit, ViewChild, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";

import { CallDetailsConfiguration, CallHistoryConfiguration, WithDetailsStyle} from 'uikit-utils-lerna'
import { fontHelper, localize, CometChatUIKitConstants} from 'uikit-resources-lerna'

import 'my-cstom-package-lit'
import { CometChatThemeService } from "../../../CometChatTheme.service";
  /**
 *
 * CometChatCallHistoryWithDetailsComponent is a wrapper component for CometChatCallDetailsComponent and CometChatCallHistorycomponent to show history and details of calls  in one screen
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
@Component({
  selector: "cometchat-call-history-with-details",
  templateUrl: "./cometchat-call-history-with-details.component.html",
  styleUrls: ["./cometchat-call-history-with-details.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCallHistoryWithDetailsComponent implements OnInit, OnChanges {
   user!: CometChat.User | null;
   group!: CometChat.Group | null;
  @Input() call!:CometChat.Call | null;
  @Input() isMobileView: boolean = false;
  @Input() messageText: string = localize("NO_CALLS_SELECTED");
  @Input() callHistoryWithDetailsStyle: WithDetailsStyle = {};
  @Input() callDetailsConfiguration: CallDetailsConfiguration = new CallDetailsConfiguration({});
  @Input() callHistoryConfiguration: CallHistoryConfiguration = new CallHistoryConfiguration({});
  @Input() onError:((error:any)=>void ) | null= (error:any)=>{
    console.log(error)
  }
    /**
     * Properties for internal use
     */
  public loggedInUser!: CometChat.User | null;
  public activeCall!: CometChat.Call | null;
  labelStyle:any = {
    background:"transparent",
    textFont:"700 22px Inter",
    textColor:"rgba(20, 20, 20, 0.33)"
  }

  constructor(private elementRef: ElementRef,private ref: ChangeDetectorRef,private themeService:CometChatThemeService) {
   }
  ngOnChanges(changes: SimpleChanges): void {

   if(changes["user"] || changes["group"]){
    this.setActiveChat();
   }
  }
  closeDetailsPage = ()=>{
    this.activeCall = null
    this.user = null
    this.group = null
    this.ref.detectChanges()
  }
  onBack = ()=>{
    this.user = null
    this.group = null
    this.activeCall = null
  }
  setWithDetailsStyle(){
    let defaultStyle:WithDetailsStyle = new WithDetailsStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      borderRadius: "none",
      border: "none",
      messageTextColor: this.themeService.theme.palette.getAccent600(),
      messageTextFont: fontHelper(this.themeService.theme.typography.title1),
    })
    this.callHistoryWithDetailsStyle = {
      ...defaultStyle,
      ...this.callHistoryWithDetailsStyle
    }
    this.labelStyle.textFont = this.callHistoryWithDetailsStyle.messageTextFont
    this.labelStyle.textColor = this.callHistoryWithDetailsStyle.messageTextColor
  }
  public onItemClick: ((call:CometChat.Call)=>void) = (call:CometChat.Call)=>{
    this.call = call
  this.setActiveChat()
  };


  setActiveChat(){
    this.activeCall = this.call
    if(this.call!.getSender().getUid() == this.loggedInUser?.getUid()){
     if(this.call!.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user){
      this.user = this.call!.getReceiver() as CometChat.User
      this.group = null
     }
     else{
       this.user = null
       this.group = this.call!.getReceiver() as CometChat.Group
     }

    }
    else{
     this.user = this.call!.getSender()
    }
  }
  ngOnInit() {
    this.setWithDetailsStyle()
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



  emptyMessageStyle = ()=>{
    return {
      background: this.callHistoryWithDetailsStyle.background || this.themeService.theme.palette.getBackground(),
      height:this.callHistoryWithDetailsStyle.height,
      width:`calc(${this.callHistoryWithDetailsStyle.width} - 280px)`,
      border:this.callHistoryWithDetailsStyle.border,
      borderRadius:this.callHistoryWithDetailsStyle.borderRadius,
    }
  }
  chatsWrapperStyles =  () => {
    return {
      height: this.callHistoryWithDetailsStyle.height,
      width: this.callHistoryWithDetailsStyle.width,
      border: this.callHistoryWithDetailsStyle.border,
      borderRadius: this.callHistoryWithDetailsStyle.borderRadius,
      background: this.callHistoryWithDetailsStyle.background || this.themeService.theme.palette.getBackground(),
    }
  }
}
