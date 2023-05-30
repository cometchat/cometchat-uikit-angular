import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import { localize, CometChatUIKitConstants, fontHelper, CometChatCallEvents, CometChatMessageEvents, MessageStatus, CometChatLocalize } from 'uikit-resources-lerna';
import { Subscription } from 'rxjs';
import { CallButtonsStyle, CallscreenStyle, CometChatSoundManager, OutgoingCallStyle ,CometChatUIKitUtility} from 'uikit-utils-lerna';
/**
*
* CometChatCallButtonsComponent is a component which shows buttons for audio and video call for 1v1 and group call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-call-buttons",
  templateUrl: "./cometchat-call-buttons.component.html",
  styleUrls: ["./cometchat-call-buttons.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatCallButtonsComponent implements OnInit {
  @Input() user!: CometChat.User;
  @Input() group!: CometChat.Group;
  @Input() voiceCallIconURL: string = "assets/Audio-Call2x.svg"
  @Input() voiceCallIconText: string = localize("VOICE_CALL")
  @Input() voiceCallIconHoverText: string = localize("VOICE_CALL")
  @Input() videoCallIconURL: string = "assets/Video-call2x.svg"
  @Input() videoCallIconText: string = localize("VIDEO_CALL")
  @Input() videoCallIconHoverText: string = localize("VIDEO_CALL")
  @Input() onVoiceCallClick!: ((user: CometChat.User, group: CometChat.Group) => void) | null;
  @Input() onVideoCallClick!: ((user: CometChat.User, group: CometChat.Group) => void) | null;
  @Input() onError: (error: CometChat.CometChatException) => void = (error: CometChat.CometChatException) => {
    console.log(error)
  }
  @Input() callButtonsStyle: CallButtonsStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "0",
    background: "transparent"
  };
  call!: CometChat.Call | null;
  public ccOutgoingCall!: Subscription;
  public ccCallRejected!: Subscription;
  public ccCallEnded!: Subscription;
  public disableButtons: boolean = false;
  showOngoingCall: boolean = false;
  sessionId: string = "";
  public callbuttonsListenerId: string = "callbuttons_" + new Date().getTime();
  public loggedInUser: CometChat.User | null = null;
  buttonStyle: any = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  }
  voiceCallButtonStyle: any = {
    buttonIconTint: "RGB(51, 153, 255)",
    buttonTextFont: "400 12px Inter",
    buttonTextColor: "RGB(51, 153, 255)",
    padding: "8px 32px"
  }
  videoCallButtonStyle: any = {
    buttonIconTint: "RGB(51, 153, 255)",
    buttonTextFont: "400 12px Inter",
    buttonTextColor: "RGB(51, 153, 255)",
    padding: "8px 32px"
  }
  showOutgoingCallscreen: boolean = false;
  outgoingCallStyle: OutgoingCallStyle = {
    width: "360px",
    height: "581px",
    titleTextFont: "700 22px Inter",
    titleTextColor: "RGB(20, 20, 20)",
    subtitleTextFont: "400 15px Inter",
    subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
    borderRadius: "8px"
  };
  ongoingCallStyle: CallscreenStyle = {}
  activeCall: CometChat.Call | null = null
  constructor(private ref: ChangeDetectorRef, private themeService: CometChatThemeService) { }
  ngOnInit(): void {
    CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
      this.loggedInUser = user
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    this.setThemeStyle()
    this.attachListeners()
    this.subscribeToEvents()
  }
  ngOnDestroy() {
    this.removeListener();
    this.unsubscribeToEvents()
  }
  getCallBuilder(): CometChat.CallSettingsBuilder | undefined {
    let audioOnlyCall: boolean = this.activeCall?.getType() == CometChatUIKitConstants.MessageTypes.audio ? true : false
    if (this.activeCall?.getType() ==  CometChatUIKitConstants.calls.meeting) {
      return undefined;
    }
    return new CometChat.CallSettingsBuilder()
      .setSessionID(this.sessionId)
      .enableDefaultLayout(true)
      .setIsAudioOnlyCall(audioOnlyCall)
      .setMode(CometChat.CALL_MODE.DEFAULT)
      .setLocalizedStringObject(CometChatLocalize.getLocale())
  }
  openOngoingCallScreen(call: CometChat.Call) {
    this.showOutgoingCallscreen = false;
    this.activeCall = call
    this.sessionId = call.getSessionId()
    this.showOngoingCall = true
    this.ref.detectChanges()
  }
  initiateCall(type: string) {

    const receiverType: string = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
    const receiverId: string = this.user ? this.user.getUid() : this.group.getGuid()
    const call: CometChat.Call = new CometChat.Call(
      receiverId,
      type,
      receiverType
    );
    CometChat.initiateCall(call)
      .then((outgoingCall) => {
        //when this component is part of chat widget trigger an event.. (outgoingcall component is used separately in chat widget)
        this.call = outgoingCall
        this.showOutgoingCallscreen = true;
        this.ref.detectChanges()
        CometChatCallEvents.ccOutgoingCall.next(
          outgoingCall
        )
      })
      .catch((error) => {
        if (this.onError) {
          this.onError(error)
        }
      });
  }

  initiateAudioCall() {
    if (this.user) {
      this.initiateCall(CometChatUIKitConstants.MessageTypes.audio)
    }
  }
  initiateVideoCall() {
    if (this.user) {
      this.initiateCall(CometChatUIKitConstants.MessageTypes.video)
    }
    else {
      this.sessionId = this.group.getGuid()
      this.sendCustomMessage()
      this.showOngoingCall = true;
      this.ref.detectChanges()

    }
  }
  sendCustomMessage() {
    const receiverType: string = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group
    const receiverId: string = this.user ? this.user.getUid() : this.group.getGuid()
    const customData = { "sessionID": this.sessionId, "sessionId": this.sessionId, "callType": CometChat.CALL_TYPE.VIDEO };
    const customType =  CometChatUIKitConstants.calls.meeting;
    const conversationId = `group_${this.sessionId}`;

    const customMessage: any = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
    customMessage.setSender(this.loggedInUser);
    customMessage.setMetadata({ incrementUnreadCount: true });
    customMessage.setReceiver((receiverType as any));
    customMessage.setConversationId(conversationId);
    customMessage.sentAt = CometChatUIKitUtility.getUnixTimestamp();
    customMessage.muid = CometChatUIKitUtility.ID();
    // custom message
    CometChatMessageEvents.ccMessageSent.next({
      message:customMessage,
      status:MessageStatus.inprogress
    })
    CometChat.sendCustomMessage(customMessage).then((msg) => {
      CometChatMessageEvents.ccMessageSent.next({
        message:msg,
        status:MessageStatus.success
      })
    })
    .catch((error:CometChat.CometChatException)=>{
     if(this.onError){
      this.onError(error)
     }
    })

  }
  cancelOutgoingCall = () => {
    CometChatSoundManager.pause()
    CometChat.rejectCall(
      this.call!.getSessionId(),
      CometChatUIKitConstants.calls.cancelled
    )
      .then((call) => {
        this.disableButtons = false;
        this.showOutgoingCallscreen = false
        CometChatCallEvents.ccCallRejected.next(call)
        this.call = null;
        this.ref.detectChanges()
      })
      .catch((error) => {
        if (this.onError) {
          this.onError(error)
        }
      });
    this.showOutgoingCallscreen = false;
    this.ref.detectChanges()
  }
  getVoiceCallButtonStyle(disableButtons:boolean){
    const buttonIconTint = disableButtons
    ? this.themeService.theme.palette.getAccent600()
    : this.callButtonsStyle.voiceCallIconTint;

  return {
    ...this.videoCallButtonStyle,
    buttonIconTint,
  };
  }
  getVideoCallButtonStyle(disableButtons: boolean) {
    const buttonIconTint = disableButtons
      ? this.themeService.theme.palette.getAccent600()
      : this.callButtonsStyle.videoCallIconTint;

    return {
      ...this.videoCallButtonStyle,
      buttonIconTint,
    };
  }

  attachListeners() {
    CometChat.addCallListener(
      this.callbuttonsListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          this.disableButtons = true
          this.ref.detectChanges()
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          this.disableButtons = false
           this.ref.detectChanges()
        },
        onOutgoingCallRejected: (call: CometChat.Call) => {
          this.disableButtons = false
          this.call = null;
          this.showOutgoingCallscreen = false;
          this.ref.detectChanges()
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          this.openOngoingCallScreen(call);
        },
      })
    );
  }
  removeListener() {
    CometChat.removeCallListener(this.callbuttonsListenerId);
  }
  subscribeToEvents() {
    this.ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe((call: CometChat.Call) => {
      this.disableButtons = false
      this.ref.detectChanges()
    })
    this.ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe((call: CometChat.Call) => {
      this.disableButtons = true
       this.ref.detectChanges()
    })
    this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call: CometChat.Call) => {
      this.disableButtons = false
       this.ref.detectChanges()
      this.activeCall = null
      this.showOngoingCall = false
      this.sessionId = ""
      this.showOutgoingCallscreen = false;
      this.ref.detectChanges()
    })
  }
  unsubscribeToEvents() {
    this.ccCallRejected?.unsubscribe()
    this.ccOutgoingCall?.unsubscribe()
    this.ccCallEnded?.unsubscribe()
  }
  setThemeStyle() {
    this.setcallButtonsStyle()
    this.setOngoingCallStyle()
  }
  setOngoingCallStyle = () => {
    let defaultStyle = new CallscreenStyle({
      maxHeight: "100%",
      maxWidth: "100%",
      border: "none",
      borderRadius: "0",
      background: "#1c2226",
      minHeight: "400px",
      minWidth: "400px",
      minimizeIconTint: this.themeService.theme.palette.getAccent900(),
      maximizeIconTint: this.themeService.theme.palette.getAccent900(),
    })
    this.ongoingCallStyle = { ...defaultStyle, ...this.ongoingCallStyle }
  }
  setcallButtonsStyle() {
    let defaultStyle: CallButtonsStyle = new CallButtonsStyle({
      width: "100%",
      height: "100%",
      background: "transparent",
      border: "none",
      borderRadius: "0",
      voiceCallIconTint: this.themeService.theme.palette.getPrimary(),
      videoCallIconTint: this.themeService.theme.palette.getPrimary(),
      voiceCallIconTextFont: fontHelper(this.themeService.theme.typography.caption1),
      videoCallIconTextFont: fontHelper(this.themeService.theme.typography.caption1),
      voiceCallIconTextColor: this.themeService.theme.palette.getPrimary(),
      videoCallIconTextColor: this.themeService.theme.palette.getPrimary(),
      buttonPadding: "8px 32px",
      buttonBackground:this.themeService.theme.palette.getAccent100(),
      buttonBorder:"0",
      buttonBorderRadius:"8px"
    })
    this.callButtonsStyle = { ...defaultStyle, ...this.callButtonsStyle }
    this.voiceCallButtonStyle = {
      buttonIconTint: this.disableButtons ? this.themeService.theme.palette.getAccent600() :  this.callButtonsStyle.voiceCallIconTint,
      buttonTextFont: this.callButtonsStyle.voiceCallIconTextFont,
      buttonTextColor: this.callButtonsStyle.voiceCallIconTextColor,
      padding: this.callButtonsStyle.buttonPadding,
      background:this.callButtonsStyle.buttonBackground,
      border:this.callButtonsStyle.border,
      borderRadius:this.callButtonsStyle.buttonBorderRadius,
      ...this.buttonStyle
    }
    this.videoCallButtonStyle = {
      buttonIconTint: this.disableButtons ? this.themeService.theme.palette.getAccent600() :   this.callButtonsStyle.videoCallIconTint,
      buttonTextFont: this.callButtonsStyle.videoCallIconTextFont,
      buttonTextColor: this.callButtonsStyle.videoCallIconTextColor,
      padding: this.callButtonsStyle.buttonPadding,
      background:this.callButtonsStyle.buttonBackground,
      border:this.callButtonsStyle.border,
      borderRadius:this.callButtonsStyle.buttonBorderRadius,
      ...this.buttonStyle
    }
  }
  wrapperStyle = () => {
    return {
      height: this.callButtonsStyle.height,
      width: this.callButtonsStyle.width,
      background: this.callButtonsStyle.background,
      border: this.callButtonsStyle.border,
      borderRadius: this.callButtonsStyle.borderRadius
    }
  }
}
