import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import {   CometChatSoundManager, OutgoingCallStyle } from "uikit-utils-lerna";
import { AvatarStyle, CardStyle, IconStyle } from 'my-cstom-package-lit'
import { CometChatThemeService } from '../../../CometChatTheme.service';
import {  localize, CometChatUIKitConstants, fontHelper, IconButtonAlignment } from 'uikit-resources-lerna';
/**
*
* CometChatOutgoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-outgoing-call",
  templateUrl: "./cometchat-outgoing-call.component.html",
  styleUrls: ["./cometchat-outgoing-call.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatOutgoingCallComponent implements OnInit, OnChanges {
  @Input() call!: CometChat.Call;
  @Input() declineButtonText: string = localize("CANCEL");
  @Input() declineButtonIconURL: string = "assets/close2x.svg";
  @Input() customView!: TemplateRef<any>;
  @Input() onError: (error: CometChat.CometChatException) => void = (error: CometChat.CometChatException) => {
    console.log(error)
  }
  @Input() disableSoundForCalls:boolean = false;
  @Input() customSoundForCalls!:string;
  @Input() avatarStyle: AvatarStyle = {
    borderRadius: "50%",
    width: "180px",
      height: "180px",
  };
  @Input() outgoingCallStyle: OutgoingCallStyle = {
    width: "100%",
    height: "100%",
    titleTextFont: "700 22px Inter",
    titleTextColor: "RGB(20, 20, 20)",
    subtitleTextFont: "400 15px Inter",
    subtitleTextColor: "RGBA(20, 20, 20, 0.58)",
    declineButtonTextFont:"400 12px Inter",
    declineButtonTextColor:"RGBA(20, 20, 20, 0.58)",
    declineButtonIconTint:"white",
    declineButtonIconBackground:"red"
  };
  @Input() onCloseClicked!:(()=>void) | null;
   buttonStyle:any = {
    height: "fit-content",
    width: "fit-content",
    buttonTextFont: "400 12px Inter",
    buttonTextColor: "RGBA(20, 20, 20, 0.58)",
    borderRadius: "8px",
    border: "none",
    buttonIconTint: "white",
    background: "",
    iconBackground:"red"
  };

  subtitleText:string = localize("CALLING")
  cardStyle:CardStyle = {
    height: "100%",
    width: "100%",
    border: "inherite",
    borderRadius: "inherite",
    background: "transparent",
    titleFont:"700 22px Inter",
    titleColor:"black",
  }
  iconAlignment:IconButtonAlignment = IconButtonAlignment.top
  iconStyle: IconStyle = {
    height: "16px",
    width: "16px",
    iconTint: "RGBA(20, 20, 20, 0.68)"
  }
  constructor(private ref: ChangeDetectorRef, private themeService: CometChatThemeService) {  }
  ngOnChanges(changes: SimpleChanges): void {
   if(changes["call"] && changes["call"].currentValue){
        if(!this.disableSoundForCalls){

       setTimeout(() => {
        this.playAudio()
       });
     }
     this.setThemeStyle()
   }
  }
  ngOnInit(): void {

  }
  playAudio() {
    if (this.customSoundForCalls) {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall, this.customSoundForCalls)
    }
    else {
      CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall)
    }
  }
  ngOnDestroy(){
    CometChatSoundManager.pause()
  }
  onClose =()=>{
    CometChatSoundManager.pause()
 if(this.onCloseClicked){
  this.onCloseClicked()

 }
  }
  getAvatarURL(){
    return this.call?.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user ? (this.call?.getReceiver() as CometChat.User)?.getAvatar() : (this.call?.getReceiver() as CometChat.Group)?.getIcon()
  }
  setThemeStyle() {
    this.setAvatarStyle()
    this.setOutgoingCallStyle()
    this.cardStyle.titleColor = this.outgoingCallStyle.titleTextColor
    this.cardStyle.titleFont = this.outgoingCallStyle.titleTextFont
  }
  setOutgoingCallStyle(){
    let defaultStyle: OutgoingCallStyle = new OutgoingCallStyle({
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
      border: "none",
      borderRadius: "0",
      titleTextFont: fontHelper(this.themeService.theme.typography.title1),
      titleTextColor: this.themeService.theme.palette.getAccent(),
      subtitleTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      subtitleTextColor: this.themeService.theme.palette.getAccent600(),
      declineButtonTextFont:fontHelper(this.themeService.theme.typography.caption1),
      declineButtonTextColor:this.themeService.theme.palette.getAccent600(),
      declineButtonIconTint:this.themeService.theme.palette.getAccent("dark"),
      declineButtonIconBackground:this.themeService.theme.palette.getError()
    })
    this.outgoingCallStyle = { ...defaultStyle, ...this.outgoingCallStyle }
    this.buttonStyle = {
      height: "fit-content",
      width: "fit-content",
      buttonTextFont: this.outgoingCallStyle.declineButtonTextFont,
      buttonTextColor: this.outgoingCallStyle.declineButtonTextColor,
      borderRadius: "8px",
      border: "none",
      buttonIconTint: this.outgoingCallStyle.declineButtonIconTint,
      background: "",
      iconBackground:this.outgoingCallStyle.declineButtonIconBackground
    }
  }
  setAvatarStyle() {
    let defaultStyle: AvatarStyle = new AvatarStyle({
      borderRadius: "50%",
      width: "180px",
      height: "180px",
      border: `1px solid  ${this.themeService.theme.palette.getAccent100()}`,
      backgroundColor: this.themeService.theme.palette.getAccent700(),
      nameTextColor: this.themeService.theme.palette.getAccent900(),
      backgroundSize: "cover",
      nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
      outerViewBorder: "",
      outerViewBorderSpacing: "",
    })
    this.avatarStyle = { ...defaultStyle, ...this.avatarStyle }
  }
  subtitleStyle(){
    return {
      textFont:this.outgoingCallStyle.subtitleTextFont,
      textColor:this.outgoingCallStyle.subtitleTextColor
    }
  }
  wrapperStyle = () => {
    return {
      height: this.outgoingCallStyle.height,
      width: this.outgoingCallStyle.width,
      background: this.outgoingCallStyle.background,
      border: this.outgoingCallStyle.border,
      borderRadius: this.outgoingCallStyle.borderRadius
    }
  }

}
