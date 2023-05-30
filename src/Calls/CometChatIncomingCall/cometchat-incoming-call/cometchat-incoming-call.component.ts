import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { StorageUtils,CallscreenStyle, IncomingCallStyle, CometChatSoundManager } from "uikit-utils-lerna";
import { AvatarStyle,  IconStyle, ListItemStyle } from 'my-cstom-package-lit'
import { Subscription } from 'rxjs';
import { CometChatThemeService } from '../../../CometChatTheme.service';
import {  localize, CometChatUIKitConstants, fontHelper, CometChatCallEvents, CometChatMessageEvents, MessageStatus, CometChatLocalize } from 'uikit-resources-lerna';
/**
*
* CometChatIncomingCallComponent is a component which shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-incoming-call",
  templateUrl: "./cometchat-incoming-call.component.html",
  styleUrls: ["./cometchat-incoming-call.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatIncomingCallComponent implements OnInit,OnChanges {
  @Input() call!: CometChat.Call | null;
  @Input() disableSoundForCalls:boolean = false;
  @Input() customSoundForCalls!:string;
  @Input() onAccept!: (call: CometChat.Call) => void;
  @Input() onDecline!: (call: CometChat.Call) => void;
  @Input() acceptButtonText: string = localize("ACCEPT");
  @Input() declineButtonText: string = localize("DECLINE");
  @Input() subtitleView!: TemplateRef<any>;
  @Input() onError: (error: CometChat.CometChatException) => void = (error: CometChat.CometChatException) => {
    console.log(error)
  }
  @Input() listItemStyle: ListItemStyle = {
    height: "100%",
    width: "100%",
    background: "",
    activeBackground: "",
    border: "",
  };
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "16px",
    width: "38px",
    height: "38px",
  };
  @Input() incomingCallStyle: IncomingCallStyle = {
    width: "fit-content",
    height: "fit-content",
  };
  public incomingcallListenerId: string = "incomingcall_" + new Date().getTime();
  subtitleText:string = localize("INCOMING_CALL")
  buttonStyle:any = {
    height:"100%",
    width:"100%",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center",
    padding:"8px 28px"
  }
  ongoingCallStyle: CallscreenStyle = {}
  showOngoingCall: boolean = false;
  showIncomingCallScreen:boolean = false
  sessionId: string = "";
  acceptButtonStyle: any = {}
  declineButtonStyle: any = {}
  public loggedInUser: CometChat.User | null = null;
  iconStyle: IconStyle = {
    height: "16px",
    width: "16px",
    iconTint: "RGBA(20, 20, 20, 0.68)"
  }
activeCall:CometChat.Call | null = null;
ccCallEnded!:Subscription;
  constructor(private ref: ChangeDetectorRef, private themeService: CometChatThemeService) {  }
  ngOnChanges(changes: SimpleChanges): void {
   if(changes["call"] && changes["call"].currentValue ){
   this.showCall(this.call!)
   }
  }
  playAudio() {
    if (this.customSoundForCalls) {
      CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall, this.customSoundForCalls)
    }
    else {
      CometChatSoundManager.play(CometChatSoundManager.Sound.incomingCall)
    }
  }
  isCallActive(call:CometChat.Call){
    let isCurrentCall:boolean = false
    if(StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)){
     let oldCall:any =  StorageUtils.getItem(CometChatUIKitConstants.calls.activecall)
     if(oldCall && oldCall.sessionId == call.getSessionId()){
      isCurrentCall =  true
     }
     else{
      isCurrentCall =  false
     }
    }
    else{
      isCurrentCall =  false
    }
   return isCurrentCall
  }
  showCall(call:CometChat.Call){
    if(!this.isCallActive(call) && this.loggedInUser?.getUid() != call?.getSender()?.getUid() && !this.call){
      if(!this.disableSoundForCalls){
        setTimeout(() => {
          this.playAudio()
        }, 100);
      }
      this.call = call
      this.showIncomingCallScreen = true
      this.ref.detectChanges()
    }
    else{
      CometChatSoundManager.pause()
      this.rejectIncomingCall(CometChatUIKitConstants.calls.busy)
    }
  }
  attachListeners() {
    CometChat.addCallListener(
      this.incomingcallListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          this.showCall(call)
          this.ref.detectChanges()
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          CometChatSoundManager.pause()
          this.call = null;
          this.ref.detectChanges()
        },
      })
    );
  }
  removeListener() {
    CometChat.removeCallListener(this.incomingcallListenerId);
  }
  localStorageChange = (event:any):any => {
		if (event?.key !== CometChatUIKitConstants.calls.activecall) {
			return false;
		}
		if (event.newValue || event.oldValue) {
			let call;
			if (event.newValue) {
				call = JSON.parse(event.newValue);
			} else if (event.oldValue) {
				call = JSON.parse(event.oldValue);
			}
			if (this.call?.getSessionId() === call?.sessionId) {
        this.showIncomingCallScreen = false
				CometChatSoundManager.pause()
				this.call = null;
        this.ref.detectChanges()
			}
		}
    return
	};
  ngOnInit(): void {
    CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
      this.loggedInUser = user
    }).catch((error:CometChat.CometChatException)=>{
      if(this.onError){
        this.onError(error)
      }
    })
    StorageUtils.attachChangeDetection(this.localStorageChange)
    this.attachListeners()
  this.setThemeStyle()
  this.ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe((call:CometChat.Call)=>{
    this.showOngoingCall = false
    this.activeCall = null
    this.call = null
    this.sessionId = ""
    this.ref.detectChanges()
  })
  }
  ngOnDestroy(){
    StorageUtils.detachChangeDetection(this.localStorageChange)
    this.removeListener()
    this.ccCallEnded?.unsubscribe()
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
  getCallTypeIcon() {
    if (this.call?.getType() == CometChatUIKitConstants.MessageTypes.audio) {
      return "assets/Audio-Call.svg"
    }
    else {
      return "assets/Video-call.svg"
    }
  }
  startDefaultCall = () => {
    let call:CometChat.Call = this.call!
		const sessionId = call?.getSessionId();
		const callType = call?.getType() === CometChatUIKitConstants.MessageTypes.audio ? true : false;
		const showRecordingButton = true
		const callSettings = new CometChat.CallSettingsBuilder()
			.setSessionID(sessionId)
			.enableDefaultLayout(true)
			.setMode(CometChat.CALL_MODE.DEFAULT)
			.setIsAudioOnlyCall(callType)
			.showRecordingButton(showRecordingButton)
			.build();
		const el:any = "";
		CometChat.startCall(
			callSettings,
			el,
			new CometChat.OngoingCallListener({
				onCallEnded: (endedCall:CometChat.Call) => {
					/* Notification received here if current ongoing call is ended. */
          if(endedCall.getAction() == CometChatUIKitConstants.calls.ended){
            CometChatCallEvents.ccCallEnded.next(endedCall)
          }
					/* hiding/closing the call screen can be done here. */
				},
			})
		);
	};
acceptIncomingCall(){
  CometChatSoundManager.pause()
  if(this.onAccept && this.call){
    this.onAccept(this.call)
  }

  else{
    this.checkForActiveCallAndEndCall()
    .then((response) => {
      CometChat.acceptCall(this.call!.getSessionId())
        .then((call) => {
          CometChatCallEvents.ccCallAccepted.next(call)
          StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, call)
          this.showOngoingCall = true
          this.activeCall = call
          this.sessionId = call?.getSessionId()
          this.showIncomingCallScreen = false
          this.ref.detectChanges()
        })
        .catch((error) => {
       if(this.onError){
         this.onError(error)
       }
        });
    })
    .catch((error) => {
      if(this.onError){
        this.onError(error)
      }
    });
  }
}
checkForActiveCallAndEndCall = () => {
  let call:CometChat.Call = CometChat.getActiveCall()
  return new Promise((resolve, reject) => {
    if (!call) {
      return resolve({ success: true });
    }
    let sessionID = call?.getSessionId();
    CometChat.endCall(sessionID)
      .then((response) => {
        return resolve(response);
      })
      .catch((error) => {
        return reject(error);
      });
  });
};
rejectIncomingCall(reason:string =  CometChatUIKitConstants.calls.rejected){
  CometChatSoundManager.pause()
  if(this.onDecline && this.call){
    this.onDecline(this.call)
  }
else{

	CometChat.rejectCall(this.call!.getSessionId(), reason)
  .then((rejectedCall) => {
    StorageUtils.setItem(CometChatUIKitConstants.calls.activecall, rejectedCall)
     CometChatCallEvents.ccCallRejected.next(rejectedCall)
     this.showOngoingCall = false
     this.activeCall = null
     this.call = null;
     this.ref.detectChanges()
  })
  .catch((error) => {
if(this.onError){
  this.onError(error)
}
  });
}
}
getCallBuilder(): CometChat.CallSettingsBuilder | undefined {
  let audioOnlyCall: boolean = this.call?.getType() == CometChatUIKitConstants.MessageTypes.audio ? true : false
  return new CometChat.CallSettingsBuilder()
    .setSessionID(this.sessionId)
    .enableDefaultLayout(true)
    .setIsAudioOnlyCall(audioOnlyCall)
    .setMode(CometChat.CALL_MODE.DEFAULT)
    .setLocalizedStringObject(CometChatLocalize.getLocale())
}
  setThemeStyle() {
    this.setincomingCallStyle()
    this.setAvatarStyle()
    this.setOngoingCallStyle()
    this.iconStyle.iconTint = this.incomingCallStyle.subtitleTextColor
  }
  setListItemStyle(){
    let defaultStyle:ListItemStyle = new ListItemStyle({
      height: "100%",
      width: "100%",
      background: this.themeService.theme.palette.getBackground(),
      activeBackground: "transparent",
      borderRadius: "0",
      titleFont: this.incomingCallStyle.titleTextFont,
      titleColor: this.incomingCallStyle.titleTextColor,
      border: "none",
      separatorColor:this.themeService.theme.palette.getAccent200(),
      hoverBackground:"transparent"
    })
    this.listItemStyle = {...defaultStyle,...this.listItemStyle}
  }
  setincomingCallStyle(){
    let defaultStyle: IncomingCallStyle = new IncomingCallStyle({
      width: "fit-content",
      height: "fit-content",
      background: this.themeService.theme.palette.getAccent800("light"),
      border: "none",
      borderRadius: "8px",
      titleTextFont: fontHelper(this.themeService.theme.typography.title2),
      titleTextColor: this.themeService.theme.palette.getAccent("dark"),
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
      subtitleTextColor: this.themeService.theme.palette.getAccent800("dark"),
      acceptButtonTextFont:fontHelper(this.themeService.theme.typography.text2),
      acceptButtonTextColor:this.themeService.theme.palette.getAccent("dark"),
      acceptButtonBackground:this.themeService.theme.palette.getPrimary(),
      acceptButtonBorderRadius:"8px",
      acceptButtonBorder:"none",
      declineButtonTextFont:fontHelper(this.themeService.theme.typography.text2),
      declineButtonTextColor:this.themeService.theme.palette.getAccent("dark"),
      declineButtonBackground:this.themeService.theme.palette.getError(),
      declineButtonBorderRadius:"8px",
      declineButtonBorder:"none",
    })
    this.incomingCallStyle = { ...defaultStyle, ...this.incomingCallStyle }
    this.setListItemStyle();
    this.acceptButtonStyle = {
      border:this.incomingCallStyle.acceptButtonBorder,
      borderRadius:this.incomingCallStyle.acceptButtonBorderRadius,
      background:this.incomingCallStyle.acceptButtonBackground,
      buttonTextFont:this.incomingCallStyle.acceptButtonTextFont,
      buttonTextColor:this.incomingCallStyle.acceptButtonTextColor,
      ...this.buttonStyle
    }
    this.declineButtonStyle = {
      border:this.incomingCallStyle.declineButtonBorder,
      borderRadius:this.incomingCallStyle.declineButtonBorderRadius,
      background:this.incomingCallStyle.declineButtonBackground,
      buttonTextFont:this.incomingCallStyle.declineButtonTextFont,
      buttonTextColor:this.incomingCallStyle.declineButtonTextColor,
      ...this.buttonStyle
    }
  }
  setAvatarStyle() {
    let defaultStyle: AvatarStyle = new AvatarStyle({
      borderRadius: "16px",
      width: "38px",
      height: "38px",
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
  subtitleStyle = () => {
    return {
      textFont: this.incomingCallStyle.subtitleTextFont,
      textColor: this.incomingCallStyle.subtitleTextColor
    }
  }
  wrapperStyle = () => {
    return {
      height: this.incomingCallStyle.height,
      width: this.incomingCallStyle.width,
      background: this.incomingCallStyle.background,
      border: this.incomingCallStyle.border,
      borderRadius: this.incomingCallStyle.borderRadius,
      padding:"8px"
    }
  }
}