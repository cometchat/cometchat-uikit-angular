import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { States, TitleAlignment, SelectionMode, GroupsStyle, ListStyle, BaseStyle,  } from "uikit-utils-lerna";
import { AvatarStyle, DateStyle, IconStyle, ListItemStyle } from 'my-cstom-package-lit'
import { Subscription } from 'rxjs';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import { CometChatOption, localize, CometChatUIKitConstants, fontHelper, DatePatterns, CometChatCallEvents, CometChatMessageEvents, IMessages, MessageStatus } from 'uikit-resources-lerna';
import { CallHistoryStyle,CallingDetailsUtils } from 'uikit-utils-lerna';
/**
*
* CometChatCallHistory is a wrapper component which renders callhistory of the loggedinuser using CometChatListItem && CometChatList.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-call-history",
  templateUrl: "./cometchat-call-history.component.html",
  styleUrls: ["./cometchat-call-history.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatCallHistoryComponent implements OnInit {
  @Input() messageRequestBuilder!: CometChat.MessagesRequestBuilder;
  @Input() subtitleView!: TemplateRef<any>;
  @Input() listItemView!: TemplateRef<any>;
  @Input() menu!: TemplateRef<any>;
  @Input()  options!: ((member:CometChat.Call)=>CometChatOption[]) | null;
  @Input() activeCall!: CometChat.Call | null;
  @Input() hideSeparator: boolean = false;
  @Input() selectionMode: SelectionMode = SelectionMode.none;
  @Input() hideError: boolean = false;
  @Input() title: string = localize("CALLS");
  @Input() onError: (error: any) => void = (error: any) => {
    console.log(error)
  }
  @Input() onSelect!: (call: CometChat.Call) => void;
  @Input() emptyStateView!: TemplateRef<any>;
  @Input() errorStateView!: TemplateRef<any>;
  @Input() loadingIconURL: string = "assets/Spinner.svg";
  @Input() datePattern: DatePatterns = DatePatterns.DayDateTime;
  @Input() loadingStateView!: TemplateRef<any>;
  @Input() emptyStateText: string = localize("NO_callS_FOUND")
  @Input() errorStateText: string = localize("SOMETHING_WRONG");
  @Input() titleAlignment: TitleAlignment = TitleAlignment.left;
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "32px",
    height: "32px",
  };
  @Input() dateStyle: DateStyle = {}
  @Input() callHistoryStyle: CallHistoryStyle = {
    width: "100%",
    height: "100%",
    background: "",
    border: "",
    borderRadius: "",
    titleTextFont: "",
    titleTextColor: "",
    subtitleTextFont: "",
    subtitleTextColor: "",
    emptyStateTextFont: "",
    emptyStateTextColor: "",
    errorStateTextFont: "",
    errorStateTextColor: "",
    loadingIconTint: "",
    separatorColor: "rgb(222 222 222 / 46%)",
  };
  @Input() listItemStyle: ListItemStyle = {};
  @Input() onItemClick!: (call: CometChat.Call) => void;
  callsRequest!: CometChat.MessagesRequest | null;
  selectionmodeEnum: typeof SelectionMode = SelectionMode;
  public state: States = States.loading;
  ccOutgoingCall!: Subscription;
  ccCallAccepted!: Subscription;
  ccCallRejected!: Subscription;
  ccCallEnded!: Subscription;
  listStyle: ListStyle = {}
  public limit: number = 30;
  public callsList: CometChat.Call[] = [];
  public callsListenerId: string = "callsList_" + new Date().getTime();
  public loggedInUser: CometChat.User | null = null;
  onScrolledToBottom: any = null
  iconStyle: IconStyle = {
    height: "16px",
    width: "16px",
    iconTint: "RGBA(20, 20, 20, 0.68)"
  }
  constructor(private ref: ChangeDetectorRef, private themeService: CometChatThemeService) { this.state = States.loading }
  ngOnInit(): void {
    this.setThemeStyle();
    CometChat.getLoggedinUser().then((user: CometChat.User | null) => {
      this.loggedInUser = user;
      this.callsRequest = this.getRequestBuilder()
      this.fetchNextcallList()
      this.attachListeners();
      this.subscribeToEvents()
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.state = States.loading
  }
  callMenuOption(event:any, call:CometChat.Call){
    let onClick = event?.detail?.data?.onClick
    if(onClick){
      onClick(call)

    }

  }
  subscribeToEvents() {
    this.ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe((call: CometChat.Call) => {
      this.addCall(call)
    })
    this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call: CometChat.Call) => {
      this.addCall(call)
    })
    this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {
      this.addCall(call)
    })

    this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call: CometChat.Call) => {

      if(call){
        this.addCall(call)
      }
    })
  }
  unsubscribeToEvents() {
    this.ccCallAccepted?.unsubscribe()
    this.ccCallRejected?.unsubscribe()
    this.ccOutgoingCall?.unsubscribe()
    this.ccCallEnded?.unsubscribe()
  }
  ngOnDestroy() {
    this.callsRequest = null;
    this.ref.detach();
    this.removeListener();
    this.unsubscribeToEvents()
  }
  /**
   * @param  {CometChat.Call} call
   */

  /**
   * @param  {CometChat.Call} call
   */
  attachListeners() {
    CometChat.addCallListener(
      this.callsListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          this.addCall(call);
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          this.addCall(call);
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          this.addCall(call);
        },
        onOutgoingCallRejected: (call: CometChat.Call) => {
          this.addCall(call);
        },
      }),

    );
  }
  removeListener() {
    CometChat.removeCallListener(this.callsListenerId);
  }
  fetchNextcallList = () => {
    this.onScrolledToBottom = null
    this.state = States.loading
    this.ref.detectChanges()
    try {
      this.callsRequest!.fetchPrevious().then(
        (callList: CometChat.BaseMessage[]) => {
          if (callList?.length > 0) {
            this.onScrolledToBottom = this.fetchNextcallList
            this.ref.detectChanges()
          }
          if ((callList.length <= 0 && this.callsList?.length <= 0) || (callList.length === 0 && this.callsList?.length <= 0)) {
            this.state = States.empty;
            this.ref.detectChanges();
          } else {
            this.state = States.loaded
            this.callsList = [...this.callsList,...callList.reverse() as CometChat.Call[] ];
            this.ref.detectChanges();
          }
        },
        (error: any) => {
          if(this.onError){
            this.onError(error)
          }
          this.state = States.error
          this.ref.detectChanges();
        }
      ).catch((error:CometChat.CometChatException)=>{
        if(this.onError){
          this.onError(error)
        }
      })
    } catch (error: any) {
      this.state = States.error
      this.ref.detectChanges();
      if(this.onError){
        this.onError(error)
      }
    }
  }
  getSubtitle(call:CometChat.Call){
    return CallingDetailsUtils.getCallStatus(call,this.loggedInUser!)
  }
  /**
   * @param  {CometChat.Call} call
   */
  onClick = (call: CometChat.Call) => {
    if (this.onItemClick) {
      this.onItemClick(call)
    }
  }
  /**
   * @param  {CometChat.Call} call
   */
  /**
   * @param  {CometChat.Call} call
   */
  getActiveCall = (call: CometChat.Call) => {
    if (this.selectionMode == SelectionMode.none || !this.selectionMode) {
      if (call.getId() == this.activeCall?.getId()) {
        return true;
      }
      else {
        return false
      }
    }
    else {
      return false
    }
  }
  getCallTypeIcon(call: CometChat.Call) {
    if (call.getType() == CometChatUIKitConstants.MessageTypes.audio) {
      return "assets/Audio-Call.svg"
    }
    else {
      return "VideoCallIcon"
    }
  }
  getCallerName(call: CometChat.Call) {
    if (CallingDetailsUtils.isSentByMe(call,this.loggedInUser!)) {
      return call.getReceiver().getName()
    }
    return call.getSender().getName()
  }
  getRequestBuilder() {
    if (this.messageRequestBuilder) {
      return this.messageRequestBuilder
        .build();
    }
    else {
      return new CometChat.MessagesRequestBuilder()
        .setLimit(this.limit)
        .setTypes([CometChatUIKitConstants.MessageTypes.audio,CometChatUIKitConstants.MessageTypes.video])
        .setCategories( [CometChatUIKitConstants.MessageCategory.call])
        .build();
    }
  }
  /**
   * addcall
   * @param call
   */
  addCall(call: CometChat.Call) {
    this.callsList.unshift(call);
    this.ref.detectChanges()
  }
  callStyle = () => {
    return {
      height: this.callHistoryStyle.height,
      width: this.callHistoryStyle.width,
      background: this.callHistoryStyle.background,
      border: this.callHistoryStyle.border,
      borderRadius: this.callHistoryStyle.borderRadius
    }
  }
  setThemeStyle() {
    this.iconStyle.iconTint = this.themeService.theme.palette.getAccent600()
    this.setAvatarStyle()
    this.setDateStyle();
    this.setCallsStyle()
    this.listStyle = {
      titleTextFont: this.callHistoryStyle.titleTextFont,
      titleTextColor: this.callHistoryStyle.titleTextColor,
      emptyStateTextFont: this.callHistoryStyle.emptyStateTextFont,
      emptyStateTextColor: this.callHistoryStyle.emptyStateTextColor,
      errorStateTextFont: this.callHistoryStyle.errorStateTextFont,
      errorStateTextColor: this.callHistoryStyle.errorStateTextColor,
      loadingIconTint: this.callHistoryStyle.loadingIconTint,
      separatorColor: this.callHistoryStyle.separatorColor,
    }
  }
  setAvatarStyle() {
    let defaultStyle: AvatarStyle = new AvatarStyle({
      borderRadius: "24px",
      width: "36px",
      height: "36px",
      border: "none",
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = { ...defaultStyle, ...this.avatarStyle }
  }
  setDateStyle() {
    let defaultStyle: DateStyle = new DateStyle({
      textFont: fontHelper(this.themeService.theme.typography.caption2),
      textColor: this.themeService.theme.palette.getAccent600(),
      background: "transparent"
    })
    this.dateStyle = { ...defaultStyle, ...this.dateStyle }
  }

  getListItemStyle(call:CometChat.Call) {
    let defaultStyle: ListItemStyle = new ListItemStyle({
      height: "45px",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: this.themeService.theme.palette.getAccent100(),
      borderRadius: "0",
      titleFont: fontHelper(this.themeService.theme.typography.title2),
      titleColor:  CallingDetailsUtils.isMissedCall(call,this.loggedInUser!) ? this.themeService.theme.palette.getError() : this.themeService.theme.palette.getAccent(),
      border: "none",
      separatorColor: this.themeService.theme.palette.getAccent200(),
      hoverBackground: this.themeService.theme.palette.getAccent50()
    })
    return  { ...defaultStyle, ...this.listItemStyle }
  }

  setCallsStyle() {
    let defaultStyle: CallHistoryStyle = new CallHistoryStyle({
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleTextColor: this.themeService.theme.palette.getAccent600(),
      background: this.themeService.theme.palette.getBackground(),
      border: `1px solid ${this.themeService.theme.palette.getAccent50()}`,
      titleTextFont: fontHelper(this.themeService.theme.typography.title1),
      titleTextColor: this.themeService.theme.palette.getAccent(),
      emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
      emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
      errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
      errorStateTextColor: this.themeService.theme.palette.getAccent600(),
      loadingIconTint: this.themeService.theme.palette.getAccent600(),
      separatorColor: this.themeService.theme.palette.getAccent400(),
    })
    this.callHistoryStyle = { ...this.callHistoryStyle, ...defaultStyle }
  }
  subtitleStyle = () => {
    return {
      font: this.callHistoryStyle.subtitleTextFont,
      color: this.callHistoryStyle.subtitleTextColor
    }
  }
}
