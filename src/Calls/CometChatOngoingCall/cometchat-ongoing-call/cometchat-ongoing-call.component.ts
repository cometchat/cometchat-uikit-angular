import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import  "my-cstom-package-lit";
import 'uikit-utils-lerna'
import { localize } from 'uikit-resources-lerna';
import { CallscreenStyle } from 'uikit-utils-lerna';
/**
*
* CometChatOngoingCallComponent is a component whic shows outgoing call screen for default audio and video call.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: "cometchat-ongoing-call",
  templateUrl: "./cometchat-ongoing-call.component.html",
  styleUrls: ["./cometchat-ongoing-call.component.scss"],
})
export class CometChatOngoingCallComponent implements OnInit {
  @Input() ongoingCallStyle: CallscreenStyle = {
    maxHeight: "100%",
    maxWidth: "100%",
    border: "none",
    borderRadius: "0",
    background: "grey",
	minHeight:"400px",
	minWidth:"400px",
	minimizeIconTint:"white",
	maximizeIconTint:"white",
  }
  @Input() resizeIconHoverText:string = localize("RESIZE")
  @Input() sessionID:string = ""
  @Input() minimizeIconURL:string = "assets/reduce-size.svg"
  @Input() maximizeIconURL:string = "assets/increase-size.svg"
  @Input() callSettingsBuilder!:CometChat.CallSettingsBuilder;
  ngOnInit(): void {
  }


}
