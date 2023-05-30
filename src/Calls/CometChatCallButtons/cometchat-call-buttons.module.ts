import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallButtonsComponent } from "./cometchat-call-buttons/cometchat-call-buttons.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import  "my-cstom-package-lit";
import { CometChatOutgoingCall } from "../CometChatOutgoingCall/cometchat-outgoing-call.module";
import { CometChatOngoingCall } from "../CometChatOngoingCall/cometchat-ongoing-call.module";
@NgModule({
  declarations: [CometChatCallButtonsComponent],
  imports: [
    CommonModule,
CometChatOutgoingCall,
CometChatOngoingCall
  ],
  exports: [CometChatCallButtonsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatCallButtons {}
